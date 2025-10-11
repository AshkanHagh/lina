#!/bin/bash

# Start SSH server
/usr/sbin/sshd

# Start Docker daemon (required for DinD)
dockerd &

# Keep the container running (tail a file or run a shell; adjust as needed for your dev workflow)
exec tail -f /dev/null
