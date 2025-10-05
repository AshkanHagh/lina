FROM ubuntu:22.04

RUN apt-get update
RUN apt-get install -y \
  sudo \
  openssh-server

# Install ca-certificates and set up Docker's APT repository
RUN apt-get install -y ca-certificates curl gnupg lsb-release && \
  install -m 0755 -d /etc/apt/keyrings && \
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && \
  chmod a+r /etc/apt/keyrings/docker.asc && \
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $( . /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}" ) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null && \
  apt-get update

RUN apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Set up SSH
RUN mkdir /var/run/sshd && \
  # Create a user with sudo privileges (for VPS-like access)
  useradd -m -s /bin/bash lina && \
  echo 'lina:pass' | chpasswd && \
  usermod -aG sudo lina && \
  usermod -aG docker lina && \
  # Allow password auth (for simplicity; use keys in production)
  sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
  sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 22

ENTRYPOINT ["/entrypoint.sh"]
