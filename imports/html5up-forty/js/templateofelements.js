import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HSK1 } from '../../api/hsk1.js';

import '../elements.html';



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
      amplify.store("hsklibraryHSK1",[]);
      amplify.store("hsklibraryHSK2",[]);
      amplify.store("hsklibraryHSK3",[]);
      amplify.store("hsklibraryHSK4",[]);
      amplify.store("hsklibraryHSK5",[]);
      amplify.store("hsklibraryHSK6",[]);
    } else {
        // Do nothing!
    }

  }
});
Template.voc.helpers({

});

Template.voclist.helpers({
  name(){
    var level = Session.get('level');
    return level;
  },
  vocabulary(){
    var level = Session.get('level');
    var query = {};
    query["level"] = level;
    return HSK1.find(query);
  }
});



function generateQuestion(caller,popselected){

  var voc = caller.voc.get();
  var level = Session.get('level');
  if(voc == undefined || voc.length == 0 || level != caller.level.get()){
    if(level){

      var query = {};
      query["level"] = level;
      var temp = HSK1.find(query);
      voc = [];

      var knownWords = amplify.store()["hsklibrary"+level];
      temp.forEach(function(ele){

        if(!knownWords||knownWords.indexOf(ele.simp)<0){
          voc.push(ele);
        }

      });
      //voc = temp.fetch();
      Session.set("currentVoc",undefined);
      caller.answers.set([]);
      caller.voc.set(voc);
      caller.level.set(level);

    }
  };

  var result = Session.get("currentVoc");
  if(voc&&voc.length>0){
    if(popselected&&result){
      //we already have a variable, no need to reset it
    }else{
        var selector = (Math.round((Math.random()*(voc.length-1))));
        result = voc[selector];
        if(result){
          result.second = result.pinyin;
          result.first = result.simp;
          if(popselected){
            var temp = caller.voc.get()
            if(temp){
                temp.splice(selector,1);
                caller.voc.set(temp);
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




function generateAnswers(caller){
  var options = 4;
  var result = caller.answers.get();
  if(result==undefined||result.length==0&&caller.voc.get().length>0){
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
          result[i] = generateQuestion(caller);
          if(result[i]){
              result[i].correct = false;
          }

        }
        if(result[i]==undefined){

        }else{
          result[i].text = result[i].translation;
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

});

Template.quiz.onRendered(function(){
  var result = generateQuestion(Template.instance(),true);
  if(result){

  }else{

  }
  generateAnswers(Template.instance());
})

function answered(e,instance){
  if(e.currentTarget.getAttribute("correct")){
    //Answer is correct!
    instance.lastanswer.set(1);
    //Save in amplify so the hanzi is not quizzed again
    var temp = amplify.store()["hsklibrary"+instance.level.get()];
    if(!temp){temp = []};
    temp.push(Session.get("currentVoc").simp);
    amplify.store("hsklibrary"+instance.level.get(),temp);

  }else{
    //Answer is not correct
    instance.lastanswer.set(0)
    //put back to possible questions
    var temp = instance.voc.get();
    temp.push(Session.get("currentVoc"));
    instance.voc.set(temp);
  }
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
    return "-- " +instance.voc.get().length;
  },
  levelis(){
    var result = Template.instance().level.get();
    if(!Template.instance().level.get()||Template.instance().level.get()==null||Template.instance().level.get().length==0){
      return "Select a Category above";
    }
    return Template.instance().level.get();
  },
  answers(){
    var result = Session.get("level");
    return Template.instance().answers.get();
  },
  first(){
    var instance = Template.instance();
    var level = Session.get("level");
    var result = Session.get("currentVoc");
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
