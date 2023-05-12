FROM ubuntu:22.04

# Base install adapted from 14Oranges/Soda
RUN export DEBIAN_FRONTEND="noninteractive"; apt-get update && apt-get install -y --no-install-recommends \
                       apt-utils \
                       bc \         
                       bash \       
                       cron \
                       curl \
                       dialog \
                       ffmpeg \
                       imagemagick \
                       gpg-agent \
                       npm \
                       software-properties-common \
                       sudo \
                       unzip \
                       zip 

#
# Install nodejs
#
# First remove nodejs as it ends up conflicting with the new install
RUN export DEBIAN_FRONTEND="noninteractive"; apt-get purge -y nodejs && sudo apt-get autoremove -y

# Install
RUN curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN export DEBIAN_FRONTEND="noninteractive"; apt-get update && apt-get -y install nodejs

RUN npm install -g npm@latest;

#########################################


#RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app/ll-kasa-bridge
#COPY ./ll-kasa-bridge/package.json /usr/src/app/

#RUN npm install

#COPY ./ll-kasa-bridge/. /usr/src/app


#
# Install the app
#

# Creating a new directory for app files and setting path in the container
#RUN mkdir -p /usr/src/app
# Setting working directory in the container
#WORKDIR /usr/src/app
# Copy source code (including package.json/package-lock.json)
#COPY . /usr/src/app
# Install dependencies
#RUN npm install
# Expose port to the docker engine
EXPOSE 3000

#command to run within the container

CMD ["ls"]





#copying the package.json file(contains dependencies) from project source dir to container dir
#COPY package.json /usr/src/app
