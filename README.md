# Backend and Web UI for Automation and Real Time Data Applications

Prerequisites:
- MongoDB 6
- Node 20
- NPM 10

To Clone:
```
git clone https://github.com/jowe81/ll-kasa-bridge.git
```

To Install the Backend:
```
cd ll-kasa-bridge/backend
npm i
```

Copy and adjust the .env File:
```
cp .env.example .env
nano .env
```


## Backend Notes

On Ubuntu, if using UFW, the following rule must be added to enable UDP discovery:
```
sudo ufw allow from 192.168.1.0/24 to any port 1:65535 proto udp
```
