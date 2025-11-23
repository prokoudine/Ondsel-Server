<!--
SPDX-FileCopyrightText: 2024 Ondsel <development@ondsel.com>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Lens Platform

## Getting Started

### Clone the repository with submodules

```bash
git clone --recurse-submodules https://github.com/FreeCAD/Ondsel-Server.git Lens
cd Lens
```

## Installation

You can install Lens in two ways:
1. Using docker-compose (Recommended, only requires Docker)
2. Manual installation (Requires all dependencies)

### Prerequisites for docker-compose
- Install Docker (https://docs.docker.com/engine/install/)

### Prerequisites for manual installation
- Install MongoDB (https://www.mongodb.com/docs/manual/installation/)
- Install NodeJS (https://nodejs.org/en/download)
- Install Docker (needed for FC-Worker)

### Using docker-compose (Recommended)

This is the easiest way to run the entire application stack.

#### Create environment file:
```bash
cp env.example .env
# or for using AWS S3 for storage:
cp env.with-aws.example .env
```

#### Start the server:
```bash
# With analytics (recommended):
docker-compose --profile matomo-enabled up --build -d

# Without analytics:
docker-compose up --build -d

# Rebuild the frontend on env change:
docker-compose build --no-cache frontend

# For development:
docker-compose -f docker-compose.dev.yml --profile matomo-enabled up --build -d

# To use prebuild docker images
docker-compose -f docker-compose.prebuilds.yml --profile matomo-enabled up --build -d
```

That's it! The application should now be running at http://localhost:3000

#### Default Credentials

##### Matomo Analytics
- URL: http://localhost:7000
- Username: admin
- Email: admin@local.test
- Password: admin@local.test

##### Frontend Application
- URL: http://localhost:3000
- Email: admin@local.test
- Password: admin@local.test

These credentials can be customized using environment variables in the `.env` file.

**Note:** For production environments, it's strongly recommended to change these default credentials using environment variables.


### Manual Installation

#### Running MongoDB

- Install MongoDB
- Start the MongoDB service: `systemctl start mongodb`
- If necessary, remove an old database: `od-backend-db`, for example using MongoDB Compass

#### Running frontend

- Go to the `frontend` directory
- Rename `env.example` to `.env` (Or export variables)
- Install frontend dependencies `npm ci`
- Finally, run server `npm run dev`

```bash
$ cd frontend
$ mv env.example .env
$ set -a; . ./.env; set +a
$ npm ci
$ npm run dev
```

To run from Docker, recompile with:

```bash
sudo docker build -t frontend .
```

and run (or re-run) with:

```bash
sudo docker run --env-file .env -p 80:80 --rm --name frontend frontend:latest
```

If it is required to make the server accessible on the local network, change
the environment variable below in `.env` and use the hostname or IP address
where the backend is available.

```bash
VITE_APP_API_URL=http://<host-or-ip-of-backend>:3030/
```

Then run the frontend with:

```bash
npm run dev -- --host 0.0.0.0
```

#### Running backend

- Go to the `backend` directory
- Rename `env.example` or `env.with-aws.example` (for using AWS S3 for storage) to `.env` (Or export variables)
- Install frontend dependencies `npm ci`
- Optionally, initialize the MongoDB database `npm run migration addDefaultAdminUser`
- Finally, run server `npm run dev`

```bash
$ cd backend
$ mv env.example .env # or `mv env.with-aws.example .env` for using AWS S3 for storage
$ set -a; . ./.env; set +a
$ npm ci
$ npm run migration addDefaultAdminUser
```

Then:

```bash
npm run dev
```

#### Running FC-Worker

The FC-Worker is a submodule and has its own [repository](https://github.com/FreeCAD/FC-Worker).

- Go to the `FC-Worker` directory
- Build the docker image (`docker-compose build`)
- Run the docker image (`docker-compose up -d`)

```bash
$ cd FC-Worker
$ docker-compose build
$ docker-compose up -d`
```

Check if it works:

```bash
curl -v http://127.0.0.1:9000/2015-03-31/functions/function/invocations -X POST -H "Content-Type: application/json" -d '{"command":"<your-health-check-string>"}'
```

<!-- ## Important Links -->

<!-- - DEV -->
<!--     - Frontend: http://ec2-54-234-132-150.compute-1.amazonaws.com:8080/ -->
<!--     - Backend API: http://ec2-54-234-132-150.compute-1.amazonaws.com/ -->
<!--     - API docs: http://ec2-54-234-132-150.compute-1.amazonaws.com/docs/ -->
<!-- - Production -->
<!--     - Frontend: https://lens.example.com/ -->
<!--     - Backend API: https://lens-api.example.com/ -->
<!--     - API docs: https://lens-api.example.com/docs/ -->


<!-- ## Deployment -->

<!-- ## Deployment to PROD -->

<!-- 1. Merge code to production branch. -->
<!-- 1. Now, create a zip file of backend and frontend source code. Run following commands: -->
<!--     1. `git fetch origin` -->
<!--     1. `git checkout origin/production` -->
<!--     1. `cd backend` -->
<!--     1. `zip -r ./od-backend.zip .` -->
<!--     1. `cd ../frontend` -->
<!--     1. add the `.env` file that you have -->
<!--     1. `zip -r ./od-frontend.zip .` -->
<!-- 1. Login to AWS dashboard (https://console.aws.amazon.com/console/home). -->
<!-- 1. Open `Elastic Beanstalk` app (https://us-east-1.console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/environments) -->
<!-- 1. Deploying backend service (https://lens-api.example.com/). -->
<!--     1. Open `od-backend-prod-app-env` environment. -->
<!--     1. Click on `Upload and deploy` button. -->
<!--     1. This will open a dialog to upload ZIP. -->
<!--     1. Upload `od-backend.zip` file and in Version label put commit hash (i.e  `d7fb86244117efb679edd0bb41bedf230cb2fc19`) -->
<!--     1. This will deploy backend service (https://lens-api.example.com/) -->
<!-- 1. Deploying frontend service (https://lens.example.com/). -->
<!--     1. Open `od-frontend-prod-app-env` environment. -->
<!--     1. Click on `Upload and deploy` button. -->
<!--     1. This will open a dialog to upload ZIP. -->
<!--     1. Upload `od-frontend.zip` file and in Version label put commit hash (i.e  `d7fb86244117efb679edd0bb41bedf230cb2fc19`) -->


<!-- ## Running migration on PROD -->

<!-- 1. Login to AWS dashboard and open EC2 page. -->
<!-- 1. Open `od-backend-prod-app-env` instance page. -->
<!-- 1. Click on Connect to Instance button. -->
<!-- ```bash -->
<!-- [root@ip-172-31-26-128 ~]# docker ps -->
<!-- CONTAINER ID   IMAGE          COMMAND                  CREATED       STATUS       PORTS      NAMES -->
<!-- 9987508aaaa4   9bd321c31a70   "docker-entrypoint.s…"   4 hours ago   Up 4 hours   3030/tcp   vigorous_dirac -->
<!-- [root@ip-172-31-26-128 ~]# docker exec -it 9987508aaaa4 /bin/sh -->
<!-- /app # npm run migration <migration_name> > <migration_name>.logs -->
<!-- /app # exit -->
<!-- [root@ip-172-31-26-128 ~]# exit -->
<!-- ``` -->
