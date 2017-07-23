import { Mongo } from 'meteor/mongo';

export const Hanzi = new Mongo.Collection('hanzi');

/*Hanzi.allow({
  insert: () => false,
  update: () => false,
  remove: () => false
});

Hanzi.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});*/
