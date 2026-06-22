import sys

with open("client_manual.html", "r") as f:
    content = f.read()

template = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ContentFlow Client Manual</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {{
            font-family: 'Inter', sans-serif;
            line-height: 1.7;
            margin: 60px auto;
            max-width: 800px;
            color: #1f2937;
        }}
        h1 {{
            color: #111827;
            font-size: 32px;
            margin-bottom: 24px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 12px;
        }}
        h2 {{
            color: #1f2937;
            font-size: 24px;
            margin-top: 40px;
            margin-bottom: 16px;
        }}
        h3 {{
            color: #374151;
            font-size: 18px;
            margin-top: 24px;
            margin-bottom: 12px;
        }}
        p {{
            margin-bottom: 16px;
        }}
        ul {{
            margin-bottom: 24px;
            padding-left: 24px;
        }}
        li {{
            margin-bottom: 12px;
        }}
        strong {{
            color: #111827;
            font-weight: 600;
        }}
        code {{
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
            color: #4b5563;
        }}
        hr {{
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 40px 0;
        }}
        .header-logo {{
            text-align: center;
            margin-bottom: 50px;
        }}
        .header-logo h1 {{
            border: none;
            font-size: 42px;
            color: #3b82f6;
            margin-bottom: 8px;
        }}
        .header-logo p {{
            color: #6b7280;
            font-size: 18px;
        }}
    </style>
</head>
<body>
    <div class="header-logo">
        <h1>ContentFlow</h1>
        <p>Client Portal User Guide</p>
    </div>
    {content}
</body>
</html>
"""

with open("client_manual_styled.html", "w") as f:
    f.write(template)
