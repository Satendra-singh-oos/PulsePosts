# A Scalable full-stack application.

- It is a blog application

## Functional Requirements:

Without Sign-in:

- Users can read blogs.

After sign-in:

- Users can post blog
- Users can like, comment and reply on blogs
- Users can follow the author of the blog
- Users get a dashboard to create, update and delete blogs.
- Users can bookmark the blog
- Users can subscribe to our newsletter to get a notification when a new blog gets posted.

## Non-functional requirements:

- Scalable
- Available
- Low latency in reading blog

## Choose a DB:

- We have 2 choices, either SQL or NoSQL. Since schema is fixed, I will go with SQL DB like PostgreSQL. But here, you can also use No-SQL.

## Reading Blog Architecture:

- For caching, I will go with Redis.
- For message queue, I will go with BullMQ

When we have cache-miss, our job is to write that data into the cache. We do it asynchronously since it is non-critical task

## Writing blog architecture:

When user do write request then we directly write into redis since write reqst are not frequent.

But if we would be making a write-heavy app then we would stream those data into message queue or Redis, not db

After writing into db, we will write those into Redis also so when user request for that data we would serve it from Cache.

Since writing data into Redis is non-critical task so we would do it asynchronously by using message queue.

When we write blogs into DB, we have to send notifications to subscribed users. This we will do using message queue since it is non-critical task.

## Small tasks like user-authentication .

For authentication I would go with JWT since I'm not making a very secure app which requires server logout otherwise I would have gone with session-auth.

## The frontend.

For front-end, I will go with Nextjs14 and typescript.
Don't use ReactJS anymore it has many disadvantages.

For styling, there are several options like tailwind CSS + shadcn or material UI etc.
