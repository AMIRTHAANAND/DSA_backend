@echo off
echo Setting up DSA Backend Database...

echo.
echo Step 1: Creating .env file...
copy env.example .env
echo .env file created from template.

echo.
echo Step 2: Please update the .env file with your MySQL credentials:
echo - Open .env file
echo - Update DATABASE_URL with your MySQL username and password
echo - Update JWT_SECRET with a secure random string
echo.
echo Example DATABASE_URL:
echo DATABASE_URL="mysql://root:yourpassword@localhost:3306/dsa_learning_platform"
echo.

echo Step 3: Make sure MySQL is running on your system
echo - Start MySQL service
echo - Create database 'dsa_learning_platform' if it doesn't exist
echo.

echo Step 4: Run database setup commands:
echo npm run prisma:generate
echo npm run prisma:migrate
echo npm run seed
echo.

echo Step 5: Start the server:
echo npm run dev
echo.

pause

