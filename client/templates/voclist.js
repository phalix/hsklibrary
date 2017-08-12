import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HSK1 } from '../../imports/api/hsk1.js';
import { getPaginationSize } from '../main.js';
import { initialLevelOfCorrectlyAnsweredVariable } from './quiz.js';
import '../../imports/html5up-forty/elements.html';


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
    if(level){
      if(getPaginationSize() * Math.max(Template.instance().currentPage.get(),1) > HSK1.find({"level":level}).count())
      {
          return level+" is loading...";
      }
    }


    return level;
  },
  vocabulary(){
    var level = Session.get('level');
    var current = amplify.store()["hsklibrary"+level];
    if(!current){current = {}};

    var query = {};
    query["level"] = level;
    var options = {};
    options.sort = {};
    options.sort.pinyinlowercase = 1;
    options.limit = getPaginationSize();
    options.skip = getPaginationSize() * Template.instance().currentPage.get();
    var result = HSK1.find(query,options).fetch();
    for(var i=0;i<result.length;i++){
      var checkVoc;
      checkVoc = current[result[i].simp];
      if(!checkVoc){
        result[i].grade = initialLevelOfCorrectlyAnsweredVariable;
        result[i].gradepinyin = initialLevelOfCorrectlyAnsweredVariable;
      }else{
        result[i].grade = checkVoc.grade;
        result[i].gradepinyin = checkVoc.gradepinyin;
      }
    }
    //Template.instance().collectionQuery.set(result);
    return result;
  },
  pages(){
    var level = Session.get('level');
    var query = {};
    query["level"] = level;
    var query = HSK1.find(query);
    if(query){
      var pages = Math.ceil(query.count()/getPaginationSize());
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
        //return nothing because with only one result, it makes no sense to let the user choose.
        result = [];
      }
      return result;
    }
    return [];
  },


});
