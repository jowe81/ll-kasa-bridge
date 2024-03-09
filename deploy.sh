echo "Stopping"
docker compose down
echo "Removing old image..."
docker rmi jj-auto-backend -f
echo "Rebuilding..."
docker build -t jj-auto-backend .
echo "Starting..."
docker compose up -d
docker ps