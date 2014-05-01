# Find Faster

### Faster & Efficient Implementation of Meteor's Collection.find()

Find Faster is a faster and efficient implementation of `Collection.find()`. It creates a short lived observer for each identical query and use it as a cache to deliver efficient and faster MongoDB Collection reads.

> In order to get the benefit of `find-faster` you need configure your meteor app with an **oplog** connection.

## Installation

~~~bash
mrt add find-faster
~~~

After that simply use `findFaster` & `findOneFaster` instead of `find` and `findOne`. For an example:

~~~js
var Posts = new Meteor.Collection();
var data = Posts.findFaster({owner: 'arunoda'}).fetch();
~~~

`findFaster()` does only supports `fetch`, `map` and `forEach` cursor methods only. For others you should not use `findFaster()`.

## What are benefits of Find Faster?

Find Faster generally gives you lower responseTime for your reads and reduce the CPU usage. If you are reading a lot of data from MongoDB, the read performance and CPU usage will improve a lot.

When you are fetching a lot of data from the MongoDB, node MongoDB driver needs to converts BSON objects coming from MongoDB into JavaScript objects. That is a CPU intensive task and that's why `find-faster` can improved the CPU usage a lot in those cases.

> Refer the Find Faster Introduction article on MeteorHacks for more information.

## When To Use `find-faster`

Find Faster only activated if you are using the oplog and if your query satisfy the oplog. If not, it will fallback to the default. These are the places you can use find faster and it shines.

* If you are fetching a lot of data from MongoDB
* If your collection has more reads than writes
* If your query has considerable amount of throughput (5+ requests per second)

## When Not To Use `find-faster`

* If your query's cardinality is pretty high, then their will be more cache misses than hits
* If you really need the exact state of the db (more on this later)
* if you don't use oplog and query does not satisfy the oplog (find-faster will fallback to the default, if the query cannot utilize the oplog)

## Find Faster reads are Eventually Consistent

That means, you are reading from a cache and it does not have the exact state as the DB at a given time, but it will come that state eventually. For an example, lets look at the following code. It **may** not work with `find-faster`

~~~js
var doc = Posts.findOneFaster({_id: "hello"});
console.log(doc); //undefined

Posts.insert({_id: "hello", content: "awesome"});
doc = Posts.findOneFaster({_id: "hello"});
console.log(doc); //can be undefined
~~~

That's why you should not use `find-faster` if you need the exact state of the DB at a given time.

### This is not a bad as it seems

In general Eventually Consistent property is not a bad thing. Let's look at an example. Our example is a chat app; we are checking the permissions before we accept the chat.

~~~js
Meteor.methods({
  chat: function(group, messgae) {
    var query = {_id: group, users: this.userId};
    var options = {fields: {users: 0}}
    var existsInGroup = Groups.findOneFaster(query, options);

    if(existsInGroup) {
      // insert the message
    } else {
      throw new Meteor.Error(401, "You are banned!");
    }
  }
});
~~~

Let's say, administrator has banned an user from chatting into a specific group. Admin only gets the confirmation message once Meteor updates all the observer's with the change. Since we maintain the cache as an observer, we also get notified.

So, if the user tries to chat into that group just after the admin saw the confirmation message, user will get blocked. That's because our cache got update as stated.

If the user is connected to another Meteor server other the admin connected to, user may can chat even after the admin saw the confirmation message, but that delay will be in milliseconds.

> That being said, do not use `find-faster` for mission critical activities if your collection has writes which might affect the activity.