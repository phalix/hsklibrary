import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HSK1 } from '../../imports/api/hsk1.js';
import { getPaginationSize } from '../main.js';

import '../../imports/html5up-forty/elements.html';

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
      options.sort = {};
      options.sort.pinyinlowercase = 1;
      options.limit = getPaginationSize();
      options.skip = getPaginationSize() * page;

      var temp = HSK1.find(query,options);
      voc = [];

      var knownWords = amplify.store()["hsklibrary"+level];
      if(!knownWords){knownWords={};}
      var counter = 0;
      temp.forEach(function(ele){
        counter += 1;
        var doaddtheword = false;
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
        if(!currentStatusTemp){
          currentStatusTemp={};
        }
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
                  if(currentStatus[element] && currentStatus[element].simp == voc[j].simp){
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
          options.sort = {};
          options.sort.pinyinlowercase = 1;
          options.limit = getPaginationSize();
          options.skip = getPaginationSize() * page;


          var temp = HSK1.find(query,options);
          voc = temp.fetch();
          for(var i = 0;i<voc.length;i++){
            if(accordingToQuestion && accordingToQuestion.simp==voc[i].simp){

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
        var temporary_result = undefined;
        if(result){
          temporary_result = currentStatus[result.simp];
          if(temporary_result){
            result = temporary_result;
          }
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

const numberOfPossibleAnswers = 4;
export const initialLevelOfCorrectlyAnsweredVariable = 4;
const numberOfLevels = 9;
const translation_static = "translation";
const pinyin_static = "pinyin";

function generateAnswers(caller,pinyinOrTranslation){
  var options = Math.min(numberOfPossibleAnswers,caller.voc.get().length+1);
  var result = caller.answers.get();
  if(result==undefined||result.length==0/*&&caller.voc.get().length>0*/){
    var correct = Session.get("currentVoc");

    if(correct){
      result = [];
      resultSimpArray = [];
      var correctposition = Math.round(Math.random()*(options-1));
      for(var i = 0;i<options;i++){
        if(i==correctposition){
          result[i] = correct;
          if(result[i]){
            result[i].correct = true;
          }

        }else{
          var counterForChange = 0;
          result[i] = generateQuestion(caller,false,correct);
          while(resultSimpArray.indexOf(result[i].simp)>-1&&counterForChange<5){
            result[i] = generateQuestion(caller,false,correct);
            counterForChange++;
          }
          if(result[i]){
              result[i].correct = false;
          }

        }
        if(result[i]==undefined){

        }else{
          resultSimpArray.push(result[i].simp);
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
    var level = Session.get("level");
    generateQuestion(instance,true);
    if(HSK1.find({"level":level}).count()>0&&instance.voc.get().length == 0){
      return "No Words left.";
    }
    return "Words left: " +instance.voc.get().length+",";
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
