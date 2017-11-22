[![CircleCI](https://circleci.com/gh/Miki79/ip-lookup.svg?style=svg)](https://circleci.com/gh/Miki79/ip-lookup)
[![Coverage Status](https://coveralls.io/repos/github/Miki79/ip-lookup/badge.svg?branch=master)](https://coveralls.io/github/Miki79/ip-lookup?branch=master)
[![Sonar Status](https://sonarcloud.io/api/badges/gate?key=net.giardi.lambda.ip-lookup)](https://sonarcloud.io/api/badges/gate?key=net.giardi.lambda.ip-lookup)

# IP ASN lookup
This code generates an HTTP endpoint in AWS to translate an IP to ASN.
The information is from apnic.net

This project has been inspired by [Team Cymru](http://www.team-cymru.org/) who is doing a great job, but rather than hammer their APIs, I decided to build my own service, so that I could abuse of it as much as I wanted.

## Deploy application
```
npm run deploy
```
[More information on serverless](https://serverless.com/framework/docs/providers/aws/guide/deploying/)

## Test
```
npm run test
```

## Sonar scan
1) Install sonar-scan
```
npm install -g sonarqube-scanner
```

2) Define SONAR_ORGANIZATION and SONAR_TOKEN as enviromenta variables

3) Run scan
```
npm run sonar
```