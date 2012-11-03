/*
 *  queue.js
 *
 */


var util = require("util");
var EventEmitter = require("events").EventEmitter;

function Queue () {
  this.concurrency = 1;
  this.active = [];
  this.jobs = [];
}
util.inherits(Queue, EventEmitter);

Queue.prototype.push = function (job, cb) {
  var self = this;
  if (this.jobs.length === 0) {
    process.nextTick(function () {
      self.run();
    });
  }
  if (job instanceof Array) {
    job.forEach(function (j) { 
      self.push(j);
    });
  } else {
    this.jobs.push([job, cb]);
  }
}

Queue.prototype.run = function () {
  if (this.jobs.length > 0 && this.active.length < this.concurrency) {
    var job = this.jobs.shift();
    this.active.push(job);
    this.run();
    var self = this;
    var cb = job[1];
    job = job[0];
    job(function (err) {
      if (cb) cb(err, self);
      self.emit("advance", err, self);
      if (self.jobs.length === 0 && self.active.length === 1) {
        self.active = [];
        self.emit("drain", self);
      } else {
        self.active.shift();
        self.run();
      }
    });
  }
}

Queue.prototype.empty = function (job) {
  this.jobs = [];
}

module.exports = Queue;