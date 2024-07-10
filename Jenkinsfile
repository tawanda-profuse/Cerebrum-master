pipeline {
    agent any
    
    environment {
        DOCKER_API_IMAGE = 'yeduaizw/api-server'
        DOCKER_MAIN_IMAGE = 'yeduaizw/main-server'
        DOCKER_FRONTEND_IMAGE = 'yeduaizw/front-end'
        VERSION = 'latest_10'
        ENV_FILE_PATH = '/home/ubuntu/.env'
        VITE_DEV_API_URL = 'http://localhost:8000'
        VITE_PROD_API_URL = '/api_v2'
        VITE_SERVER_DEV_URL = 'http://localhost:5001/workspace'
        VITE_SERVER_PROD_URL = '/workspace'
    }

    stages {
        stage('Docker Login') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    }
                }
            }
        }

        stage('Checkout') {
            when {
                expression { env.GIT_BRANCH == 'origin/prod' }
            }
            steps {
                checkout scm
            }
        }
        
        stage('Build API Docker Image') {
            when {
                expression { env.GIT_BRANCH == 'origin/prod' }
            }
            steps {
                dir('workspace') {
                    script {
                        docker.build("${DOCKER_API_IMAGE}:${VERSION}", '-f Dockerfile .')
                    }
                }
            }
        }
        
        stage('Build Main Docker Image') {
            when {
                expression { env.GIT_BRANCH == 'origin/prod' }
            }
            steps {
                script {
                    docker.build("${DOCKER_MAIN_IMAGE}:${VERSION}", '-f Dockerfile .')
                }
            }
        }
        
        stage('Build Frontend Docker Image') {
            when {
                expression { env.GIT_BRANCH == 'origin/prod' }
            }
            steps {
                dir('client') {
                    script {
                        def customImage = docker.build("${DOCKER_FRONTEND_IMAGE}:${VERSION}", 
                            """--build-arg VITE_DEV_API_URL=${env.VITE_DEV_API_URL} \
                            --build-arg VITE_PROD_API_URL=${env.VITE_PROD_API_URL} \
                            --build-arg VITE_SERVER_DEV_URL=${env.VITE_SERVER_DEV_URL} \
                            --build-arg VITE_SERVER_PROD_URL=${env.VITE_SERVER_PROD_URL} \
                            --build-arg VITE_NODE_ENV=production \
                            -f Dockerfile .""")
                    }
                }
            }
        }
        
        stage('Push Docker Images') {
            when {
                expression { env.GIT_BRANCH == 'origin/prod' }
            }
            steps {
                script {
                    sh """
                        docker push ${DOCKER_API_IMAGE}:${VERSION}
                        docker push ${DOCKER_MAIN_IMAGE}:${VERSION}
                        docker push ${DOCKER_FRONTEND_IMAGE}:${VERSION}
                    """
                }
            }
        }
        
        stage('Deploy') {
            when {
                expression { env.GIT_BRANCH == 'origin/prod' }
            }
            steps {
                script {
                    // Pull new images
                    sh """
                        docker pull ${DOCKER_API_IMAGE}:${VERSION}
                        docker pull ${DOCKER_MAIN_IMAGE}:${VERSION}
                        docker pull ${DOCKER_FRONTEND_IMAGE}:${VERSION}
                    """

                    // Ensure network exists
                    sh "docker network create yeduai_network || true"

                    // Stop and remove old containers
                    sh """
                        docker stop api-server main-server front-end || true
                        docker rm api-server main-server front-end || true
                    """

                    // Deploy new containers
                    sh """
                        docker run -d --name api-server --network yeduai_network --env-file ${ENV_FILE_PATH} -p 5001:5001 ${DOCKER_API_IMAGE}:${VERSION}
                        docker run -d --name main-server --network yeduai_network --env-file ${ENV_FILE_PATH} -p 8000:8000 ${DOCKER_MAIN_IMAGE}:${VERSION}
                        docker run -d --name front-end \
                        --network yeduai_network \
                        --env-file ${ENV_FILE_PATH} \
                        -e VITE_DEV_API_URL=${env.VITE_DEV_API_URL} \
                        -e VITE_PROD_API_URL=${env.VITE_PROD_API_URL} \
                        -e VITE_SERVER_DEV_URL=${env.VITE_SERVER_DEV_URL} \
                        -e VITE_SERVER_PROD_URL=${env.VITE_SERVER_PROD_URL} \
                        -e VITE_NODE_ENV=production \
                        -p 3000:80 ${DOCKER_FRONTEND_IMAGE}:${VERSION}
                    """

                    // Simple check to see if containers are running
                    sh """
                        docker ps | grep api-server
                        docker ps | grep main-server
                        docker ps | grep front-end
                    """

                    // Cleanup old images
                    sh "docker image prune -af"
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout'
            cleanWs()
        }
    }
}