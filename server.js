const dotenv = require('dotenv');

// uncaughtExpection for sync code err
process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    console.log('UNCAUGHT EXPECTION Shutting down');
    console.log(err);
        process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

// console.log(process.env);
// start server
const port = process.env.PORT || 3001;    // env variable check in config.env file
const server = app.listen(port, () => {
    console.log(`app is running at port ${port}`);
});

// unhandledRejection for async code forgot to set catch method
process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    console.log('UNHANDLED REJECTION Shutting down');
    console.log(err);
    server.close(() => {
        process.exit(1);
    });   
});


process.on('SIGTERM', () => {// this is a heroku deployment platform signal which always shut doun application for every 24 hours to improve its performance so below method is use to compleate the pending request else the app will not handel the pending request
    console.log('SIGTERM recived going to shutdown');
    server.colse(() => {
        console.log('all pending request are compleated ')
    })
})