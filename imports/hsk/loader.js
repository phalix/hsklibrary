import { Template } from 'meteor/templating';


//import './cedict_ts.json';
//import './hsk1.json';

Template.body.events({
  'submit .reload'(event) {
    // Prevent default browser form submit
    event.preventDefault();


  },
});
