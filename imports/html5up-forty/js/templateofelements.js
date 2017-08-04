import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HSK1 } from '../../api/hsk1.js';

import '../elements.html';

//

Template.body.events({
    'click section#one article':function(e,f){
      var target = e.toElement;
      var i = 10;

      while(target.nodeName != "ARTICLE"&&i>0){
        target = target.parentElement;
        i--;
      }

      var level = target.getAttribute("level");
      Session.set('level', level);



    }
});
Template.Actions.events({
  'click #reset':function(e,f){
    if (confirm('Are you sure you want to delete all of your progress?')) {
      amplify.store("hsklibraryHSK1",{});
      amplify.store("hsklibraryHSK2",{});
      amplify.store("hsklibraryHSK3",{});
      amplify.store("hsklibraryHSK3a",{});
      amplify.store("hsklibraryHSK3b",{});
      amplify.store("hsklibraryHSK4",{});
      amplify.store("hsklibraryHSK4a",{});
      amplify.store("hsklibraryHSK4b",{});
      amplify.store("hsklibraryHSK4c",{});
      amplify.store("hsklibraryHSK4d",{});
      amplify.store("hsklibraryHSK5",{});
      amplify.store("hsklibraryHSK6",{});
    } else {
        // Do nothing!
    }

  }
});
Template.voc.helpers({

});

Template.voclist.onCreated(function(){
  this.collectionQuery = new ReactiveVar(undefined);
  this.currentPage = new ReactiveVar(0);
})
var paginateNoOfVocs = 10;

Template.voclist.events({
  'click ul.pagination li a.page':function(e,a){
    var page = e.currentTarget.getAttribute("page");
    Template.instance().currentPage.set(page);
    Session.set("page",page);
  }
})
Template.voclist.helpers({
  name(){
    var level = Session.get('level');
    return level;
  },
  vocabulary(){
    var level = Session.get('level');
    var query = {};
    query["level"] = level;
    var options = {};
    options.limit = getPaginationSize();
    options.skip = getPaginationSize() * Template.instance().currentPage.get();
    var query = HSK1.find(query,options);
    Template.instance().collectionQuery.set(query);
    return query;
  },
  pages(){
    var level = Session.get('level');
    var query = {};
    query["level"] = level;
    var query = HSK1.find(query);
    //var query = Template.instance().collectionQuery.get();
    if(query){
      var pages = Math.ceil(query.fetch().length/getPaginationSize());
      pages = Math.min(pages,150);
      var result = [];
      for(var i = 0;i<pages;i++){
        var pobject = {};
        pobject.text = (i+1)+"";
        pobject.page = i;
        if(i==Template.instance().currentPage.get()){
          pobject.active=function(){return true};
        }else{
          pobject.active=function(){return false};
        }
        result.push(pobject);
      }
      if(result.length == 1){
        result = [];
      }
      return result;
    }
    return [];
  },


});



function generateQuestion(caller,popselected,accordingToQuestion){

  var voc = caller.voc.get();
  var noOfWords = caller.noOfVoc.get();
  var level = Session.get('level');
  var page = Session.get('page');
  var pagination = Session.get('pagination');
  if(!page){
    page = 0;
  }
  if(noOfWords == 0
    || level != caller.level.get()
    || page != caller.page.get()
    || pagination != caller.pagination.get()
  ){
    if(level){

      var query = {};
      query["level"] = level;

      var options = {};
      options.limit = getPaginationSize();
      options.skip = getPaginationSize() * page;

      var temp = HSK1.find(query,options);
      voc = [];

      var knownWords = amplify.store()["hsklibrary"+level];

      var counter = 0;
      temp.forEach(function(ele){
        counter += 1;
        var doaddtheword = false;

        if(!knownWords){
          //nothing has been yet saved, so quiz it
          doaddtheword = true;
          ele.grade = initialLevelOfCorrectlyAnsweredVariable;
          ele.gradepinyin = initialLevelOfCorrectlyAnsweredVariable;
        }else{
          //the particular word has never been quizzed, so quiz it
          var temp_cur = knownWords[ele.simp];
          if(!temp_cur){
            doaddtheword = true;
            ele.grade = initialLevelOfCorrectlyAnsweredVariable;
            ele.gradepinyin = initialLevelOfCorrectlyAnsweredVariable;
          }else{
            if(temp_cur.grade>0||temp_cur.gradepinyin>0){
              //the grade of the word is not 0, so quiz it.
              doaddtheword = true;
              ele.grade = temp_cur.grade;
              ele.gradepinyin = temp_cur.gradepinyin;
            }
          }
        }
        if(doaddtheword){
          voc.push(ele);
        }

      });

      caller.noOfVoc.set(counter);

      //voc = temp.fetch();
      Session.set("currentVoc",undefined);
      caller.answers.set([]);
      caller.voc.set(voc);
      caller.level.set(level);
      caller.page.set(page);
      caller.pagination.set(pagination);

    }
  };

  var result = Session.get("currentVoc");
  if(voc&&voc.length>0){
    if(popselected&&result){
      //we already have a variable, no need to reset it
    }else{
        //first select a vocabel that is not in amplify but in voc
        //second from a list of vocabel with the highest level in pinyin or translation
        //go down level by level
        var setOfVocabulary = [];
        var currentStatusTemp = amplify.store()["hsklibrary"+level];
        var currentStatus ={};
        var highestlevelPinyin = 0;
        var highestlevelTranslation = 0;
        if(!accordingToQuestion){
          for(var j=0;j<voc.length;j++){
            if(currentStatusTemp[voc[j].simp]){
              currentStatus[voc[j].simp] = currentStatusTemp[voc[j].simp];
            }else{
              setOfVocabulary.push(voc[j])
            }
          }
          if(setOfVocabulary.length>0){

          }else{

            for(var  element in currentStatus){
              highestlevelTranslation = Math.max(currentStatus[element].grade,highestlevelTranslation);
              highestlevelPinyin = Math.max(currentStatus[element].gradepinyin,highestlevelPinyin);
            }
            if(highestlevelTranslation>highestlevelPinyin){
              highestlevelPinyin = numberOfLevels+1;
            }else if(highestlevelTranslation<highestlevelPinyin){
              highestlevelTranslation = numberOfLevels+1;
            }

            for(var element in currentStatus){
              if(currentStatus[element].grade==highestlevelTranslation||
                currentStatus[element].gradepinyin==highestlevelPinyin
              ){
                for(var j=0;j<voc.length;j++){
                  if(currentStatus[element].simp == voc[j].simp){
                      setOfVocabulary.push(voc[j]);
                  }
                }
              }
            }

          }
        }else{
          var query = {};
          query["level"] = level;

          var options = {};
          options.limit = getPaginationSize();
          options.skip = getPaginationSize() * page;

          var temp = HSK1.find(query,options);
          voc = temp.fetch();
          for(var i = 0;i<voc.length;i++){
            if(accordingToQuestion.simp==voc[i].simp){

            }else{
                setOfVocabulary.push(voc[i]);
            }

          }
        }

        voc = setOfVocabulary;

        var selector = (Math.round((Math.random()*(voc.length-1))));
        result = voc[selector];
        if(!result){
          console.log("Error");
        }
        var temporary_result = currentStatus[result.simp];
        if(temporary_result){
          result = temporary_result;
        }
        if(result){
          result.second = result.pinyin;
          result.first = result.simp;
          if(popselected){
            var temp = caller.voc.get();
            if(temp){
                //temp.splice(selector,1);
                caller.voc.set(temp);
                /*check if either pinyin or translation should be tested*/
                var what = undefined;
                what = pinyin_static;
                if(result.gradepinyin == 0){
                  what = translation_static;
                }else if(result.gradepinyin < result.grade){
                  what = translation_static;
                }else if(result.gradepinyin == result.grade){
                  var randomized = Math.round(Math.random());
                  if(randomized==1){
                    what = translation_static;
                  }
                }


                caller.pinyinOrTranslation.set(what);

                Session.set("currentVoc",result);
                caller.answers.set([]);
                generateAnswers(caller);
            }
          }
      }
    }

  }

  return result;
}

var numberOfPossibleAnswers = 4;
var initialLevelOfCorrectlyAnsweredVariable = 4;
var numberOfLevels = 9;
var translation_static = "translation";
var pinyin_static = "pinyin";

function generateAnswers(caller,pinyinOrTranslation){
  var options = Math.min(numberOfPossibleAnswers,caller.voc.get().length+1);
  var result = caller.answers.get();
  if(result==undefined||result.length==0/*&&caller.voc.get().length>0*/){
    var correct = Session.get("currentVoc");

    if(correct){
      result = [];
      var correctposition = Math.round(Math.random()*(options-1));
      for(var i = 0;i<options;i++){
        if(i==correctposition){
          result[i] = correct;
          if(result[i]){
            result[i].correct = true;
          }

        }else{
          result[i] = generateQuestion(caller,false,correct);
          if(result[i]){
              result[i].correct = false;
          }

        }
        if(result[i]==undefined){

        }else{

          if(caller.pinyinOrTranslation.get()==translation_static){
              result[i].text = result[i].translation;
          }else{
            result[i].text = result[i].pinyin;
          }

        }

      }
    }else{

    }
    caller.answers.set(result);

  }
  return result;
}

Template.quiz.onCreated(function(){
  this.voc = new ReactiveVar([]);
  this.answers = new ReactiveVar([]);
  this.noOfVoc = new ReactiveVar(0);
  this.level = new ReactiveVar(null);
  this.lastanswer = new ReactiveVar(-1);
  this.pinyinOrTranslation = new ReactiveVar(undefined);
  this.page = new ReactiveVar(0);
  this.pagination = new ReactiveVar(0);
});

Template.quiz.onRendered(function(){
  var result = generateQuestion(Template.instance(),true);
  if(result){

  }else{

  }
  generateAnswers(Template.instance());
})

function answered(e,instance){
  //Save in amplify so the hanzi is not quizzed again
  var temp = amplify.store()["hsklibrary"+instance.level.get()];
  if(!temp){temp = {}};
  var temp_cur = temp[Session.get("currentVoc").simp];
  if(!temp_cur){
    temp_cur = Session.get("currentVoc");

  }
  if(temp_cur.grade == undefined){
    temp_cur.grade = initialLevelOfCorrectlyAnsweredVariable;
  }
  if(!temp_cur.gradepinyin == undefined){
    temp_cur.gradepinyin = initialLevelOfCorrectlyAnsweredVariable;
  }
  if(e.currentTarget.getAttribute("correct")){
    //Answer is correct!
    instance.lastanswer.set(1);
    //grade +1
    if(instance.pinyinOrTranslation.get()==translation_static){
        temp_cur.grade -= 1;
    }else{
        temp_cur.gradepinyin -= 1;
    }





  }else{
    //Answer is not correct
    instance.lastanswer.set(0)
    //wrong answer +1 grade;
    if(instance.pinyinOrTranslation.get()==translation_static){
      if(temp_cur.grade<numberOfLevels){
          temp_cur.grade += 1;
      }

    }else{
      if(temp_cur.gradepinyin<numberOfLevels){
          temp_cur.gradepinyin += 1;
      }

    }
  }
  /*if(temp_cur.grade>0||temp_cur.gradepinyin>0){
    //put back to possible questions
    var temp_voc = instance.voc.get();
    temp_voc.push(Session.get("currentVoc"));
    instance.voc.set(temp_voc);
  }*/

  if(temp_cur.grade==0&&temp_cur.gradepinyin==0){
    var temp_voc = instance.voc.get();
    var i = temp_voc.length - 1;
    while(i>= 0){
      if(temp_voc[i].simp==temp_cur.simp){
        temp_voc.splice(i,1);
      }
      i--;
    }

  }

  //restore status in amplify
  temp[temp_cur.simp]=temp_cur;
  amplify.store("hsklibrary"+instance.level.get(),temp);
  Session.set("currentVoc",undefined);
  instance.answers.set([]);
  result = generateQuestion(instance,true);
}

Template.quiz.events({
  'click ul li a.button.special.fit':function(e,a,b){
      var instance = Template.instance()
      setTimeout(function(){answered(e,instance)},200);


  }
});
Template.quiz.helpers({
  gradeofcurrentword(){
    var instance = Template.instance();
    var result = Session.get("currentVoc");
    if(result){
        if(instance.pinyinOrTranslation.get()==translation_static){
          return "Level of Word: "+result.grade+ " ("+translation_static+")";
        }else{
          return "Level of Word: "+result.gradepinyin+ " ("+pinyin_static+")";
        }

    }else{
      return "";
    }


  },
  lastanswer(){
    var instance = Template.instance();
    if(instance.lastanswer.get()==1){
        return "-- Correct";
    }else if(instance.lastanswer.get()==-1){
      return "";
    }
    return "-- Wrong";
  },
  leftover(){
    var instance = Template.instance();
    var result = Session.get("level");
    generateQuestion(instance,true);
    instance.voc.get();
    if(instance.voc.get().length == 0){
      return "";
    }
    return "Words Left: " +instance.voc.get().length+",";
  },
  levelis(){
    var result = Template.instance().level.get();
    if(!Template.instance().level.get()||Template.instance().level.get()==null||Template.instance().level.get().length==0){
      return "Select a Category above";
    }
    return "Category is: "+Template.instance().level.get()+", ";
  },
  answers(){
    var result = Session.get("level");
    return Template.instance().answers.get();
  },
  first(){
    var instance = Template.instance();
    var level = Session.get("level");
    var result = Session.get("currentVoc");
    var page = Session.get("page");
    var pagination = Session.get("pagination");
    //HSK1.find({});
    if(result){
        return result.first;
    }else{
      generateQuestion(instance,true);
    }
    return;
  },
  second(){

    var result = Session.get("currentVoc");
    if(result){
        return result.second;
    }
    return;
  },


});

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

Template.noOfWords.events({
  'click ul li a.page':function(e,a){
    var pagination = parseInt(e.currentTarget.getAttribute("words"));
    amplify.store("pagination",pagination);
    Session.set("pagination",pagination);
  }
})

Template.noOfWords.helpers({
  wordStep(){
    var nnn = [10,20,50,100,150];
    var result = [];
    for(var i = 0;i<nnn.length;i++){
      var o = {};
      o.text = nnn[i]+"";
      o.words = nnn[i];
      o.active= function(){

        var currentPaginateNoOfVocs = getPaginationSize();
        return this.words == currentPaginateNoOfVocs
      };
      result.push(o);
    }
    return result;
  }
});

function getPaginationSize(){
  var currentPaginateNoOfVocs = Session.get("pagination");
  if(!currentPaginateNoOfVocs){
    currentPaginateNoOfVocs = amplify.store()["pagination"];
    if(!currentPaginateNoOfVocs){
      Session.set("pagination",10);
      amplify.store("pagination",pagination);
      currentPaginateNoOfVocs = 10;
    }
  }

  return currentPaginateNoOfVocs;
}



Template.menubutton.events({
  'click #menubutton':function(e,a){
    $("body").addClass("is-menu-visible");
    $("body").append($("#menu"));
    //$("#menu").fadeTo(0,1);
  }
})

Template.links.onCreated(function(){
  var curid = Session.get("menuid");
  if(!curid){
    curid=0;
  }
  $("body").removeClass("menuid"+0);
  $("body").removeClass("menuid"+1);
  $("body").addClass("menuid"+curid);

});

Template.links.events({
  'click a':function(e,a){
    $("body").removeClass("is-menu-visible");
    //$("#wrapper").append($("#menu"));
    var data = Blaze.getData(e.currentTarget);

    Session.set("menuid",data.id);
    $("body").removeClass("menuid"+0);
    $("body").removeClass("menuid"+1);
    $("body").addClass("menuid"+data.id);
  }
})
Template.links.helpers({
  links(){
    var result = [];
    var learn = {};
    learn.name ="Learn";
    learn.id = 0;
    result.push(learn);
    var translate = {};
    translate.name ="Translate";
    translate.id = 1;
    result.push(translate);
    return result;
  }
})
