# flux
run your own video streaming platform

## dev-setup
### frontend
Run frontend dev-server in container using the following:
```
docker run --name flux-dev --rm --user 1000:1000 -it -p 3000:3000 -v ./frontend:/frontend node:25-alpine sh -c 'cd /frontend && npm run dev -- --host'
```
