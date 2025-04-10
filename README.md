# 🌾 Forage Budget Calculator

A Streamlit app to calculate available grazing days based on forage availability, paddock details, and herd composition.

[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://cibo-grazing-calculator.streamlit.app/)

## Features

- **Paddock Details**: Input paddock area, forage availability, and desired residual dry matter.
- **Cattle Management**: Add and manage cattle herd details, including animal categories and productivity levels.
- **Sheep Management**: Add and manage sheep flock details, including animal classes and dry sheep equivalents (DSE).
- **Goat Management**: Add and manage goat herd details, including weight-based adjustments for DSE.
- **Results and Visualization**: View total animal equivalents (AE), DSE, daily feed demand, and estimated grazing days. Includes a feed budget visualization chart.

## How to Run It Locally

1. Install the requirements:

   ```bash
   $ pip install -r requirements.txt
   ```

2. Run the app:

   ```bash
   $ streamlit run streamlit_app.py
   ```

3. Open the app in your browser at `http://localhost:8501`.

## How to Use the App

1. Navigate to the **Paddock Details** tab to input paddock and forage information.
2. Add your herd details in the **Cattle**, **Sheep**, and **Goats** tabs.
3. View the grazing budget results in the **Results** tab, including estimated grazing days and a feed budget visualization.

## Notes

- The app uses standard intake values based on Animal Equivalents (AE) and Dry Sheep Equivalents (DSE).
- Regular monitoring is recommended to adjust grazing plans as needed.

---

Forage Budget Calculator | v1.1
