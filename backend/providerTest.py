import requests

def generate_sql(prompt: str):
    url = "http://localhost:11434/v1/chat/completions"
    payload = {
        "model": "llama3",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a professional SQL converter: "
                    "you receive plain-language requests and return only valid, "
                    "optimized SQL queries without any extra commentary."
                )
            },
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }
    resp = requests.post(url, json=payload)
    return resp.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    sql = generate_sql("Выведи все проекты которые выполнил Максат и все даты завершения проекта")
    print(sql)
