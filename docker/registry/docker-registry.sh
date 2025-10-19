#!/bin/bash
# setting registry username/password
mkdir -p ~/docker-registry/auth

htpasswd -Bc ~/docker-registry/auth/registry.passwd lina

docker login localhost:6500
