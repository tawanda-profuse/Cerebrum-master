pipeline {
    agent any
    
    environment {
        DOCKER_API_IMAGE = 'yeduaizw/api-server'
        DOCKER_MAIN_IMAGE = 'yeduaizw/main-server'
        VERSION = 'latest_v6'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build API Docker Image') {
            steps {
                dir('workspace') {
                    script {
                        docker.build("${DOCKER_API_IMAGE}:${VERSION}", '-f Dockerfile .')
                    }
                }
            }
        }
        
        stage('Build Main Docker Image') {
            steps {
                script {
                    docker.build("${DOCKER_MAIN_IMAGE}:${VERSION}", '-f Dockerfile .')
                }
            }
        }
        
        stage('Push Docker Images') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                            docker push ${DOCKER_API_IMAGE}:${VERSION}
                            docker push ${DOCKER_MAIN_IMAGE}:${VERSION}
                            docker logout
                        """
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh """
                    sudo docker pull ${DOCKER_API_IMAGE}:${VERSION}
                    sudo docker pull ${DOCKER_MAIN_IMAGE}:${VERSION}
                    sudo docker stop api-server || true
                    sudo docker stop main-server || true
                    sudo docker rm api-server || true
                    sudo docker rm main-server || true
                    sudo docker run -d --name api-server --network yeduai_network --env-file ./.env -p 5001:5001 ${DOCKER_API_IMAGE}:${VERSION}
                    sudo docker run -d --name main-server --network yeduai_network --env-file ./.env -p 8000:8000 ${DOCKER_MAIN_IMAGE}:${VERSION}
                """
            }
        }
    }
}