# api/cron/your-script-runner.py
import os
import subprocess
import sys

# Add the 'scripts' directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

# Import your script
try:
    from your_script import main as your_script_main
except ImportError:
    print(
        "Error: Could not import 'your_script.py'. Ensure it's in the 'scripts' directory and has a 'main' function."
    )
    your_script_main = None


def handler(request, response):
    """
    Vercel Serverless Function handler.
    """
    if request.method == "GET":  # Or 'POST' if you prefer
        if your_script_main:
            try:
                # Execute your script's main function
                result = your_script_main()
                return {
                    "statusCode": 200,
                    "body": f"Script executed successfully. Result: {result}",
                }
            except Exception as e:
                print(f"Error executing script: {e}")
                return {"statusCode": 500, "body": f"Error executing script: {e}"}
        else:
            return {
                "statusCode": 500,
                "body": "Script not found or main function missing.",
            }
    return {"statusCode": 405, "body": "Method Not Allowed"}


# For local testing directly, if needed
if __name__ == "__main__":
    # Simulate a request/response object for local testing
    class MockRequest:
        method = "GET"

    class MockResponse:
        pass

    response_data = handler(MockRequest(), MockResponse())
    print(response_data)
