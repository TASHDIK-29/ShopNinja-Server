# ShopNinja

Our Delivery Management System, ShopNinja Offers our users delivering their products to the destiny in time with safety.



## Features of my website


* Admin Dashboard: Provides comprehensive control for managing parcel bookings, approving requests, and assigning
  delivery personnel.
* User Dashboard: Allows users to book parcels, track the status of their bookings, and view their delivery history.
* Deliveryman Dashboard: Enables delivery personnel to view assigned parcels, update delivery status, and manage their
  delivery tasks efficiently.

* Utilizes JSON Web Tokens (JWT) for securing APIs, ensuring authenticated and authorized access to specific
  functionalities, thereby enhancing user data security.

* Users can book parcels by providing necessary details through a user-friendly interface, making the booking process
  straightforward and efficient.

* Users can track the status of their parcels in real-time, from booking to delivery, ensuring transparency and 
  providing peace of mind.

* Parcel bookings require admin approval before being assigned to a deliveryman, maintaining order and allowing the
  admin to oversee logistics effectively.

* Admins can assign parcels to delivery personnel based on various criteria, such as location or availability, 
  optimizing the delivery process.

* Deliverymen can update the delivery status (e.g., out for delivery, delivered) through their dashboard, providing 
  real-time updates to users and the admin.

* Admins have access to a full view of all parcel bookings, including pending, approved, and delivered parcels, 
  allowing for effective management and decision-making.

* The platform integrates Firebase for user authentication, providing a secure and reliable way to manage user 
  sign-ups, logins, and authentication processes.

* The platform ensures secure user authentication through JWT, preventing unauthorized access and safeguarding user 
  information and interactions.


## Technologies

* Node.js
* Express.js
* MongoDB
* JavaScript 

## Run At Local Machine

* Clone - https://github.com/TASHDIK-29/ShopNinja-Server.git
* npm i
* Set up a new collection at MongoDB and connect with server
* make sure create .env file for environment variables for DB_USER , DB_PASS , jwt access token and Stripe Secret Key.
