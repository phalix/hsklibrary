import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HSK1 } from '../imports/api/hsk1.js';


import '../imports/html5up-forty/assets/css/main.css';
import '../imports/html5up-forty/assets/css/font-awesome.min.css';
import '../imports/html5up-forty/assets/css/hskaddition.css';

import '../imports/html5up-forty/js/main.js';
import '../imports/html5up-forty/elements.html';
import '../imports/html5up-forty/index.html';
import '../imports/hsk/loader.js';

/** Templates */
import './templates/quiz.js';
import './templates/translator.js';
import './templates/voclist.js';


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

export const getPaginationSize = function(){
  var currentPaginateNoOfVocs = Session.get("pagination");
  if(!currentPaginateNoOfVocs){
    currentPaginateNoOfVocs = amplify.store()["pagination"];
    if(!currentPaginateNoOfVocs){
      Session.set("pagination",10);
      amplify.store("pagination",10);
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
