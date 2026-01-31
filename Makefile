SHELL := /bin/bash
VENV := venv
DOCKER_TAG := dev
SKIP_CLIENT =

_:
	echo "Missing target."

venv:
	[ -d "${VENV}" ] || python3 -m venv venv

run-backend-dev-server:
	cd backend && \
		source venv/bin/activate && \
		pip install . && \
		pip install -r dev-requirements.txt && \
		MODE=dev flask run

run-frontend-dev-server:
	docker run \
		--name flux-fe-build --rm --user 1000:1000 \
		-p 3000:3000 \
		-t \
		-v ./frontend:/frontend \
		node:25-alpine sh -c 'cd /frontend && npm install && npm run dev -- --host'

run-frontend-linter:
	docker run \
		--name flux-fe-lint --rm --user 1000:1000 \
		-t \
		-v ./frontend:/frontend \
		node:25-alpine sh -c 'cd /frontend && npm run lint'

ifeq ($(SKIP_CLIENT), yes)
$(info skipping client!)
build-frontend:
else
build-frontend:
	docker run \
		--name flux-build --rm --user 1000:1000 \
		-t \
		-v ./frontend:/frontend \
		node:25-alpine sh -c 'cd /frontend && npm install && GENERATE_SOURCEMAP=false npm run build'
endif

build-backend:
	rm -rf backend/src/flux/client
	cp -r frontend/dist backend/src/flux/client

build: venv build-frontend build-backend
	source "${VENV}/bin/activate" && \
		pip install --upgrade pip setuptools build && \
		cd backend && \
		python -m build --wheel --sdist

docker: build
	docker build --tag flux:${DOCKER_TAG} .

clean:
	git clean -dfX
