pipeline {
    agent any
    
    environment {
        DOCKER_API_IMAGE = 'yeduaizw/api-server'
        DOCKER_MAIN_IMAGE = 'yeduaizw/main-server'
        DOCKER_FRONTEND_IMAGE = 'yeduaizw/front-end'
        VERSION = 'latest_v8'
        ENV_FILE_PATH = '/home/ubuntu/.env'
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
                        docker.build("${DOCKER_FRONTEND_IMAGE}:${VERSION}", '-f Dockerfile .')
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
                sh """
                    docker pull ${DOCKER_API_IMAGE}:${VERSION}
                    docker pull ${DOCKER_MAIN_IMAGE}:${VERSION}
                    docker pull ${DOCKER_FRONTEND_IMAGE}:${VERSION}
                    docker stop api-server || true
                    docker stop main-server || true
                    docker stop front-end || true
                    docker rm api-server || true
                    docker rm main-server || true
                    docker rm front-end || true
                    docker network create yeduai_network || true
                    docker run -d --name api-server --network yeduai_network --env-file ${ENV_FILE_PATH} -p 5001:5001 ${DOCKER_API_IMAGE}:${VERSION}
                    docker run -d --name main-server --network yeduai_network --env-file ${ENV_FILE_PATH} -p 8000:8000 ${DOCKER_MAIN_IMAGE}:${VERSION}
                    docker run -d --name front-end --network yeduai_network --env-file ${ENV_FILE_PATH} -p 3000:80 ${DOCKER_FRONTEND_IMAGE}:${VERSION}
                """
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