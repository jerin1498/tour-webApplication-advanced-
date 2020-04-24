const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const factory = require('./handlerFactory');


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //1 get the currently booked tour
    const tour = await Tour.findById(req.params.tourId)

    //2 create checkout sessions
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],        
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100, // converting into bugs
                currency: 'usd', // dollers
                quantity: 1
            }
        ]
    })
    
    //3 create sessions as response
    res.status(200).json({
        status: 'success',
        session
    })
});

const createBookingCheckout = async session => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.display_items[0].amount / 100;
    await Booking.create({ tour, user, price });
}

exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`);// sending responce to stripe
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object // this data is equal to the data we send to the stripe while checkout session initial process for more reference check the above function getCheckoutSession
        createBookingCheckout(session);
    }
    
    res.status(200).json({received: true}) // sending responce to stripe
}

// exports.createBookingCheckout = catchAsync(async (req, res, next) => { // only for testing because this method is unsafe so use stripe webhook 
//     // This is only temporory , because this mehod is not safe
//     const { tour, user, price } = req.query;
//     if (!tour || !user || !price) return next();
//     await Booking.create({ tour, user, price });
    
//     res.redirect(req.originalUrl.split('?')[0])
// });

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBookin = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);