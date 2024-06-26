#!/bin/bash

touch /home/vagrant/team02m-2024/code/svelte/.env

echo "NO_DB=false" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "DB_HOST='team02m-db-vm0.service.consul'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "DB_REPLICA='team02m-db-replica-vm0.service.consul'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "READ_FROM_REPLICA=false" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "DB_PORT='${DBPORT}'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "DB_PASS='${DBPASS}'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "DB_USER='${DBUSER}'" >> /home/vagrant/team02m-2024/code/svelte/.env

echo "MINIO_ENDPOINT='${MINIOENDPOINT}'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "MINIO_ACCESS_KEY='${ACCESSKEY}'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "MINIO_SECRET_KEY='${SECRETKEY}'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "S3_BUCKET_NAME='${BUCKETNAME}'" >> /home/vagrant/team02m-2024/code/svelte/.env

echo "GOOGLE_CLIENT_ID='${CLIENTID}'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "GOOGLE_CLIENT_SECRET='${CLIENTSECRET}'" >> /home/vagrant/team02m-2024/code/svelte/.env
echo "BASE_URL=https://system62.rice.iit.edu" >> /home/vagrant/team02m-2024/code/svelte/.env

# Install Node.js
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash - &&\
sudo apt-get install -y nodejs

# Install dependencies
sudo npm install -g express pm2
cd /home/vagrant/team02m-2024/code/svelte/

# Building the app
sudo -u vagrant npm install
sudo -u vagrant npm run build
# Error out if build fails
if [ $? -ne 0 ]; then
    echo "npm build failed"
    exit 1
fi
sudo -u vagrant pm2 start build/index.js --name "webapp"

# This creates your javascript application service file
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u vagrant --hp /home/vagrant

# This saves which files we have already started -- so pm2 will 
# restart them at boot
sudo -u vagrant pm2 save
