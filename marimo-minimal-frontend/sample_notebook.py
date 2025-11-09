"""Sample Marimo Notebook for Testing the Minimal Frontend"""
import marimo

__generated_with = "0.9.0"
app = marimo.App()


@app.cell
def __():
    import marimo as mo
    return mo,


@app.cell
def __(mo):
    mo.md("# Welcome to Marimo Minimal Frontend!")
    return


@app.cell
def __():
    # Simple calculation
    x = 10
    y = 20
    result = x + y
    result
    return result, x, y


@app.cell
def __(result):
    # Use previous result
    print(f"The result was: {result}")
    return


@app.cell
def __():
    # Generate some data
    import matplotlib.pyplot as plt
    import numpy as np

    x = np.linspace(0, 10, 100)
    y = np.sin(x)

    plt.figure(figsize=(8, 4))
    plt.plot(x, y)
    plt.title('Sine Wave')
    plt.xlabel('x')
    plt.ylabel('sin(x)')
    plt.grid(True)
    plt.show()
    return np, plt, x, y


if __name__ == "__main__":
    app.run()
