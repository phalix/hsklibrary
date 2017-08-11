import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HSK1 } from '../../imports/api/hsk1.js';
import { getPaginationSize } from '../main.js';

import '../../imports/html5up-forty/elements.html';


function figureOutTranslation(stringOfHanzi){
  var query = {};
  query.simp = stringOfHanzi;
  var resultOfQuery_2 = HSK1.find(query).fetch();
  if(resultOfQuery_2.length>0){

    return resultOfQuery_2[0];
  }else{
    //console.log("Word not found: "+stringOfHanzi);
    var result = {};
    result.simp = stringOfHanzi;
    result.level = undefined;
    return result;
  }
}

Template.textTranslation.onCreated(function(){
  this.currentText = new ReactiveVar([]);
  this.currentTranslation = new ReactiveVar("");
  this.currentPinyin = new ReactiveVar("");
  this.currentSimpHanzi = new ReactiveVar("");
  this.currentLevel = new ReactiveVar("");
})

Template.textTranslation.events({
  'mouseenter span.hskhighlight':function(e,a){
    var target = $(e.currentTarget);
    //var data = Blaze.getData(e.currentTarget);
    var text = target.text();
    var translation = target.attr("translation");
    var pinyin = target.attr("pinyin");
    var level = target.attr("level");
    var instance = Template.instance();
    instance.currentTranslation.set(translation);
    instance.currentPinyin.set(pinyin);
    instance.currentSimpHanzi.set(text);
    instance.currentLevel.set(level);
    //TODO: Later add Trand. Hanzi
  },

  'click #delete':function(e,a){
    var text = [];
    Template.instance().currentText.set(text);
  },

  'click #translate':function(e,a){

      var text = [];
      var nodeToTranslate = Template.instance().firstNode.children[0];
      var sizeOfNode = nodeToTranslate.childElementCount
      var children = nodeToTranslate.children;
      var currentResultSet = [];
      var stringBuilder = "";
      var textContent = $(nodeToTranslate).text().trim()



      for(var j = 0;j<textContent.length;j++){
        var char = textContent.charAt(j);
        var patt = new RegExp("[äüöß \.]");

        if(!patt.test(char)){
          //this character should be translated and hightlighted with its hsk level.
          stringBuilder += char;
          //so I check if I can continue finding translation with the next word.
          var query = {};
          query.simp = new RegExp("^"+stringBuilder);
          var resultOfQuery = HSK1.find(query).fetch();
          if(resultOfQuery.length==0){
              //try to figure out the proper translation from the candidates;

              var rest = stringBuilder.substr(0,stringBuilder.length-1);
              stringBuilder = stringBuilder.substr(stringBuilder.length-1,1);
              var trans = figureOutTranslation(rest);
              text.push(trans);
          }else{
            //currentResultSet = resultOfQuery;
          }
        }
      }

      //last word.
      if(stringBuilder.length>0){
        var trans = figureOutTranslation(stringBuilder);
        text.push(trans);
      }


      Template.instance().currentText.set(text);
  }
});
Template.textTranslation.helpers({
  translation(){
    var trans = Template.instance().currentTranslation.get();
    if(trans){
      return trans;
    }else{
      return "No Translation found";
    }

  },
  pinyin(){
    return Template.instance().currentPinyin.get();
  },
  simp(){
    return Template.instance().currentSimpHanzi.get();
  },
  level(){
    return Template.instance().currentLevel.get();
  },
  text(){
    var instance = Template.instance();
    var text = instance.currentText.get();
    if(instance.firstNode){
      if(instance.firstNode.children[0]){
          $(instance.firstNode.children[0].children[0]).empty();//text("");
      }
    }


    var result = "";
    if(text.length==0){
      result = "Enter text here...";
    }else{

      for(var i= 0;i<text.length;i++){
        result += "<span class=\""
        result += "hskhighlight"
        result += " "
        result += text[i].level
        result += "\""
        result += " level="
        result += "\""
        result += text[i].level
        result += "\""
        result += " translation="
        result += "\""
        result += text[i].translation
        result += "\""
        result += " pinyin="
        result += "\""
        result += text[i].pinyin
        result += "\""
        result += ">"
        result += text[i].simp+"";
        result += "</span>"
      }
    }


    return Spacebars.SafeString(result);
  }
});
