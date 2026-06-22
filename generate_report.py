import sys

with open("project_manual.html", "r") as f:
    content = f.read()

template = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ContentFlow Manual</title>
    <style>
        body {{
            font-family: "Times New Roman", Times, serif;
            line-height: 1.6;
            margin: 40px auto;
            max-width: 800px;
            color: #333;
        }}
        h1 {{
            text-align: center;
            font-size: 28px;
            margin-bottom: 20px;
            text-transform: uppercase;
        }}
        h2 {{
            font-size: 22px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-top: 30px;
        }}
        h3 {{
            font-size: 18px;
            margin-top: 20px;
        }}
        hr {{
            border: 0;
            border-top: 2px solid #000;
            margin: 40px 0;
        }}
        .title-page {{
            text-align: center;
            margin-top: 100px;
            margin-bottom: 150px;
        }}
        .title-page h1 {{
            font-size: 36px;
            margin-bottom: 10px;
        }}
        .title-page p {{
            font-size: 18px;
            margin-bottom: 5px;
        }}
        ul {{
            margin-bottom: 20px;
        }}
        li {{
            margin-bottom: 8px;
        }}
    </style>
</head>
<body>
    <div class="title-page">
        <h1>ContentFlow: Client Portal System Manual</h1>
        <p><strong>Prepared by:</strong> Development Team</p>
        <p><strong>Date:</strong> May 2026</p>
        <hr>
    </div>
    {content}
</body>
</html>
"""

with open("project_manual_styled.html", "w") as f:
    f.write(template)
