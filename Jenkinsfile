pipeline {
    agent any
    
    tools {
        // Ensure you have "NodeJS" configured in Jenkins Global Tool Configuration
        nodejs 'Default' 
        dockerTool 'Default'
    }

    environment {
        SERVICE_NAME = "estate-search-service"
        REPO_URL = "https://github.com/maikvibes/estate-search"
        EXT_PORT = "3116" // Changed to avoid conflict with your other service
        INT_PORT = "3000" // Standard NestJS default port
        DOCKER_IMAGE = "${SERVICE_NAME}:latest"
        // Persist chat session files written under process.cwd() + '/.sessions'
        SESSIONS_HOST_PATH = "/var/lib/estate-search/sessions"
        KAFKA_BROKER = "localhost:9092"
        CHROMA_HOST = "http://localhost:8000"
        GEMINI_API_KEY = "your_gemini_api_key_from_ai_studio"
        GEMINI_MODEL = "gemini-2.5-flash"
        CORE_API_URL = "http://localhost:3000"
        PORT = "3000"
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                git branch: 'master', url: "${REPO_URL}"
            }
        }

        stage('Install & Build') {
            steps {
                // Install dependencies and run the NestJS build (tsc)
                sh "npm install"
                sh "npm run build"
            }
        }

        stage('Docker Build') {
            steps {
                  sh "docker build -t ${DOCKER_IMAGE} ."
            }
        }

        stage('Deploy') {
            steps {
                sh "docker rm -f ${SERVICE_NAME} || true"
                sh "mkdir -p ${SESSIONS_HOST_PATH}"
                sh """
                docker run -d --name ${SERVICE_NAME} \
                  -p ${EXT_PORT}:${INT_PORT} \
                  -v ${SESSIONS_HOST_PATH}:/usr/src/app/.sessions \
                  -e NODE_ENV=production \
                  -e PORT="${PORT}" \
                  -e KAFKA_BROKER="${KAFKA_BROKER}" \
                  -e CHROMA_HOST="${CHROMA_HOST}" \
                  -e GEMINI_API_KEY="${GEMINI_API_KEY}" \
                  -e GEMINI_MODEL="${GEMINI_MODEL}" \
                  -e CORE_API_URL="${CORE_API_URL}" \
                  ${DOCKER_IMAGE}
                """
            }
        }
    }
}