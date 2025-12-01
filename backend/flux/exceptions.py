"""Exception-type definitions."""


# pylint: disable=missing-class-docstring


class APIException(ValueError):
    status = 500
    short = "Unknown API-Error"


class BadRequestException(APIException):
    status = 400
    short = "Bad request"


class UnauthorizedException(APIException):
    status = 401
    short = "Unauthorized"


class NotFoundException(APIException):
    status = 404
    short = "Resource not found"


class ConflictException(APIException):
    status = 409
    short = "Conflict"


class UnprocessableException(APIException):
    status = 409
    short = "Unprocessable entity"
