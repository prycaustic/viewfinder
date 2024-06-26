from faker import Faker
import random
import mysql.connector
from mysql.connector import Error

# Connect to MySQL
try:
    connection = mysql.connector.connect(
        host='192.168.59.123',
        database='team02m_db',
        user='webapp',
        password='password'
    )

    if connection.is_connected():
        db_Info = connection.get_server_info()
        print("Connected to MySQL Server version ", db_Info)
        cursor = connection.cursor()

        # Instantiate Faker object
        fake = Faker()

        # Create users
        users = []
        for _ in range(25):
            user_id = fake.uuid4()
            email = fake.email()
            username = fake.simple_profile()['username']
            display_name = fake.name()
            date_of_birth = fake.date_of_birth(minimum_age=18, maximum_age=90)
            profile_picture = fake.image_url()
            bio = fake.text(max_nb_chars=200)
            location = fake.city()
            website = fake.url()
            contact = fake.email()
            users.append((user_id, email, username, display_name, date_of_birth, profile_picture, bio, location, website, contact))

        print(users[0])
        user_query = "INSERT INTO user (id, email, Username, DisplayName, DateOfBirth, ProfilePicture, Bio, Location, Website, Contact) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.executemany(user_query, users)
        print(user_query)

        # Create photos for each user
        for user in users:
            print(user)
            photos = []
            for _ in range(4):
                title = fake.sentence()
                uuid = '8b238ff9-fc18-48e3-a3ca-b8f54ae6205b';
                description = fake.text(max_nb_chars=200)
                photos.append((user[0], title, uuid, description))

            photo_query = "INSERT INTO Photos (UserID, Title, UUID, Description) VALUES (%s, %s, %s, %s)"
            cursor.executemany(photo_query, photos)

        connection.commit()
        print("Data inserted successfully.")

except Error as e:
    print("Error while connecting to MySQL", e)

finally:
    cursor.close()
    connection.close()
    print("MySQL connection is closed.")