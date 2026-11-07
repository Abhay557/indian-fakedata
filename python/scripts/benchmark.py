"""Measure stream generation throughput.

Usage: python python/scripts/benchmark.py [count]
"""

import sys
import time

from indian_fakedata import generate_stream


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    if count < 1:
        raise SystemExit("count must be positive")

    started = time.perf_counter()
    profiles = sum(1 for _ in generate_stream(count=count, seed=42))
    seconds = time.perf_counter() - started
    print(f"{profiles} profiles in {seconds:.2f}s")
    print(f"{profiles / seconds:,.0f} profiles/sec")


if __name__ == "__main__":
    main()
