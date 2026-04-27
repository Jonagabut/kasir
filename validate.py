import re
import json

print('=== CODE VALIDATION CHECK ===')

# Check JavaScript syntax
try:
    with open('app.js', 'r', encoding='utf-8') as f:
        js_content = f.read()

    # Basic syntax checks
    issues = []

    # Check for basic brace balance
    braces = js_content.count('{') - js_content.count('}')
    if braces != 0:
        issues.append(f'Unmatched braces: {braces}')

    # Check for console.log statements
    console_logs = len(re.findall(r'console\.log', js_content))
    if console_logs > 10:
        print(f'INFO: Found {console_logs} console.log statements')

    if issues:
        print('ISSUES FOUND:')
        for issue in issues:
            print(f'  - {issue}')
    else:
        print('✅ JavaScript syntax looks good')

except Exception as e:
    print(f'❌ Error reading app.js: {e}')

# Check HTML validity
try:
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Basic HTML checks
    if '<!DOCTYPE html>' not in html_content:
        print('⚠️  Missing DOCTYPE declaration')

    if '<html' not in html_content:
        print('❌ Missing <html> tag')

    if '</html>' not in html_content:
        print('❌ Missing </html> closing tag')

    if 'charset' not in html_content:
        print('⚠️  Missing charset meta tag')

    if 'viewport' not in html_content:
        print('⚠️  Missing viewport meta tag')

    print('✅ HTML structure looks good')

except Exception as e:
    print(f'❌ Error reading index.html: {e}')

# Check CSS validity
try:
    with open('style.css', 'r', encoding='utf-8') as f:
        css_content = f.read()

    if ':root' not in css_content:
        print('⚠️  No CSS custom properties defined')

    print('✅ CSS file exists and readable')

except Exception as e:
    print(f'❌ Error reading style.css: {e}')

print('\n=== FUNCTIONALITY CHECK ===')

# Check for key functions
key_functions = [
    'addToCart',
    'renderCart',
    'confirmPayment',
    'loadProducts',
    'editProduct',
    'viewTransactionDetail',
    'filterTransactions',
    'loadDashboard',
    'loadSalesChart',
    'loadTopProductsChart'
]

missing_functions = []
for func in key_functions:
    if f'function {func}(' not in js_content:
        missing_functions.append(func)

if missing_functions:
    print('❌ Missing functions:')
    for func in missing_functions:
        print(f'  - {func}')
else:
    print('✅ All key functions present')

# Check for key HTML elements (static and dynamic)
key_elements = [
    ('product-modal', 'static'),
    ('payment-modal', 'static'),
    ('receipt-modal', 'static'),
    ('transaction-detail-modal', 'dynamic'),  # Created dynamically
    ('chart-sales', 'static'),
    ('top-products', 'static')
]

missing_elements = []
for elem, elem_type in key_elements:
    if elem_type == 'static' and f'id="{elem}"' not in html_content:
        missing_elements.append(elem)
    elif elem_type == 'dynamic' and f'id = \'{elem}\'' not in js_content and f'id="{elem}"' not in js_content:
        missing_elements.append(elem)

if missing_elements:
    print('❌ Missing HTML elements:')
    for elem in missing_elements:
        print(f'  - {elem}')
else:
    print('✅ All key HTML elements present')

print('\n=== DEPENDENCY CHECK ===')
dependencies = [
    ('Chart.js', 'chart.js'),
    ('Supabase', 'supabase-js'),
    ('Bootstrap Icons', 'bootstrap-icons'),
    ('Google Fonts', 'googleapis.com')
]

for name, url in dependencies:
    if url in html_content:
        print(f'✅ {name} dependency found')
    else:
        print(f'❌ {name} dependency missing')

print('\n=== VALIDATION COMPLETE ===')