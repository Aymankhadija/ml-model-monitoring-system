import requests
import random
import time


API_URL = "http://127.0.0.1:8000/predict"


for i in range(10):

    customer = {
        "Age": random.randint(18, 70),

        "Gender": random.choice([
            "Male",
            "Female"
        ]),

        "Tenure": random.randint(1, 60),

        "Usage_Frequency": random.randint(1, 50),

        "Support_Calls": random.randint(0, 10),

        "Payment_Delay": random.randint(0, 30),

        "Subscription_Type": random.choice([
            "Basic",
            "Standard",
            "Premium"
        ]),

        "Contract_Length": random.choice([
            "Monthly",
            "Yearly"
        ]),

        "Total_Spend": random.randint(1000, 100000),

        "Last_Interaction": random.randint(1, 30)
    }


    response = requests.post(
        API_URL,
        json=customer
    )


    print("\nCustomer", i + 1)

    print("Customer data:")
    print(customer)

    print("Prediction:")
    print(response.json())


    time.sleep(1)