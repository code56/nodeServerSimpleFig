# node_web_server
Node web server to serve as to allow the end user to upload data to a local database

# to install run: 
'npm install'


to run the server go to the 'server' folder and run: 'node HTTPServer.js' 

you need to have a msql server set up with port: 3306.

and create an new user with 
 * mysql> CREATE USER 'admin'@'localhost';
 * mysql> GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost';

if needed :check the HTTPServer.js and change it accordingly for connecting the server to your database. Change the necessary configurations for connecting to the database.
