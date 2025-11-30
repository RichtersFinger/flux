SHELL := /bin/bash
VENV := venv
SKIP_CLIENT =
VERSION =

_:
	echo "Missing target. See README for details."

venv:
	[ -d "${VENV}" ] || python3 -m venv venv

ifeq ($(SKIP_CLIENT), yes)
$(info skipping client!)
build-frontend:
else
build-frontend:
	docker run \
		--name flux-build --rm --user 1000:1000 \
		-v ./frontend:/frontend \
		node:25-alpine sh -c 'cd /frontend && npm install && GENERATE_SOURCEMAP=false npm run build'
endif

build-backend:
	rm -rf backend/flux/client
	cp -r frontend/dist backend/flux/client

build: venv build-frontend build-backend
	[ "${VERSION}" != "" ] && \
		VERSIONENV="VERSION=${VERSION}" || \
		echo "Using default version"
	source "${VENV}/bin/activate" && \
		pip install --upgrade pip wheel setuptools && \
		cd backend && \
		${VERSIONENV} python3 setup.py sdist bdist_wheel || \
		python3 setup.py sdist bdist_wheel

clean:
	git clean -dfX
