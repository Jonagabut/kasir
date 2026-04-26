with open('app.js', 'r') as f:
    content = f.read()
brace_count = 0
for char in content:
    if char == '{':
        brace_count += 1
    elif char == '}':
        brace_count -= 1
print('Final brace count:', brace_count)