import sys, json, os
sys.path.insert(0, 'python/src')
from indian_fakedata import generate_user

out = os.path.abspath('docs/samples')
for seed in (7, 11, 13):
    user = generate_user(seed=seed)
    with open(os.path.join(out, f'python-{seed}.json'), 'w', encoding='utf-8') as f:
        json.dump(user, f, ensure_ascii=False, indent=2)
    print(seed, user['firstName'], user['lastName'])
