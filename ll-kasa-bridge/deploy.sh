echo "Deploy.sh Called successfully. Npm install"
cat ./package.json

npm install

node index.js
#nodemon
