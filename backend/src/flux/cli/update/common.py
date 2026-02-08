"""Common definitions of the update-subcommand."""

import re
from itertools import zip_longest


def compare_versions(a: str, b: str) -> bool:
    """
    Returns `True` if `a > b`. `a` and `b` should be semver-strings
    without additional metadata (only MAJOR.MINOR.PATCH). If `a` does
    not match that pattern, returns `False; if `a` does but `b` does not
    match that pattern, returns `True`.
    """
    pattern = r"([0-9]*)\.([0-9]*)\.([0-9]*)"
    vam = re.fullmatch(pattern, a)
    vbm = re.fullmatch(pattern, b)
    if vam is None:
        return False
    if vbm is None:
        return True
    va = vam.groups()
    vb = vbm.groups()
    for vap, vbp in zip_longest(va, vb):
        if vap is None and vbp is not None:
            return False
        if vap is not None and vbp is None:
            return True
        if vap is None and vbp is None:
            return False
        if (len(vap), vap) > (len(vbp), vbp):
            return True
    return False
