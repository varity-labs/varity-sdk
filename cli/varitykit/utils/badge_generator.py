"""
Deployment badge SVG generator for Varity.

Generates a personalized SVG badge after successful deployment
that developers can add to their README.
"""

from datetime import datetime
from pathlib import Path


def generate_badge_svg(app_name: str, deploy_date: str = "") -> str:
    """
    Generate an SVG badge for a Varity deployment.

    Args:
        app_name: Name of the deployed application
        deploy_date: Deployment date string (default: today)

    Returns:
        SVG string content
    """
    if not deploy_date:
        deploy_date = datetime.now().strftime("%b %d, %Y")

    # Truncate long app names
    display_name = app_name[:20] + "..." if len(app_name) > 20 else app_name

    # Calculate dynamic widths
    label_text = "deployed on"
    value_text = f"Varity"
    date_text = deploy_date

    label_width = len(label_text) * 6.5 + 12
    value_width = len(value_text) * 7 + 12
    date_width = len(date_text) * 6 + 12
    total_width = label_width + value_width + date_width

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{int(total_width)}" height="20" role="img" aria-label="{display_name}: Deployed on Varity">
  <title>{display_name}: Deployed on Varity — {deploy_date}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="{int(total_width)}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="{int(label_width)}" height="20" fill="#555"/>
    <rect x="{int(label_width)}" width="{int(value_width)}" height="20" fill="#7C3AED"/>
    <rect x="{int(label_width + value_width)}" width="{int(date_width)}" height="20" fill="#444"/>
    <rect width="{int(total_width)}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="{int(label_width * 5)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">{label_text}</text>
    <text x="{int(label_width * 5)}" y="140" transform="scale(.1)">{label_text}</text>
    <text aria-hidden="true" x="{int((label_width + label_width + value_width) * 5)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" font-weight="bold">{value_text}</text>
    <text x="{int((label_width + label_width + value_width) * 5)}" y="140" transform="scale(.1)" font-weight="bold">{value_text}</text>
    <text aria-hidden="true" x="{int((label_width + value_width + label_width + value_width + date_width) * 5)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">{date_text}</text>
    <text x="{int((label_width + value_width + label_width + value_width + date_width) * 5)}" y="140" transform="scale(.1)">{date_text}</text>
  </g>
</svg>'''


def save_badge(deployment_id: str, app_name: str) -> str:
    """
    Generate and save a deployment badge SVG.

    Args:
        deployment_id: The deployment identifier
        app_name: Name of the deployed application

    Returns:
        Path to the saved badge file
    """
    badge_dir = Path.home() / ".varitykit" / "deployments" / deployment_id
    badge_dir.mkdir(parents=True, exist_ok=True)

    badge_path = badge_dir / "badge.svg"
    svg_content = generate_badge_svg(app_name)

    with open(badge_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    return str(badge_path)
