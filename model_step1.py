import pandas as pd
from sqlalchemy import create_engine
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import pickle

def main():
    # Create an SQLAlchemy engine (adjust connection string as needed)
    engine = create_engine("mysql+pymysql://root:root@localhost/dbmanage")

    # --- Existing Step 1: Load and Engineer Features ---
    # Example: Load employee details
    employees_df = pd.read_sql("SELECT employee_id, email, skills, domains FROM employee_details", engine)
    
    # Load assignments data (assume 'status' = 1 indicates completed assignment)
    assignments_df = pd.read_sql("SELECT * FROM assignments", engine)
    
    # Load feedback data (assume each row is one feedback entry)
    feedback_df = pd.read_sql("SELECT * FROM feedback", engine)
    
    # Calculate assignment counts per employee
    assignment_counts = assignments_df.groupby("employee_id")["status"].agg(
        total_assignments="count",
        completed_assignments=lambda s: (s == 1).sum()
    ).reset_index()
    
    # Compute completion ratio as percentage
    assignment_counts["completion_ratio"] = assignment_counts.apply(
        lambda row: (row["completed_assignments"] / row["total_assignments"] * 100)
        if row["total_assignments"] > 0 else 0,
        axis=1
    )
    
    # Calculate feedback count per employee
    feedback_counts = feedback_df.groupby("employee_id")["id"].count().reset_index().rename(columns={"id": "feedback_count"})
    
    # Merge features into a single DataFrame
    features_df = employees_df.merge(assignment_counts, on="employee_id", how="left") \
                              .merge(feedback_counts, on="employee_id", how="left")
    
    # Replace NaN values with zeros (for employees with no assignments or feedback)
    features_df["total_assignments"] = features_df["total_assignments"].fillna(0)
    features_df["completed_assignments"] = features_df["completed_assignments"].fillna(0)
    features_df["completion_ratio"] = features_df["completion_ratio"].fillna(0)
    features_df["feedback_count"] = features_df["feedback_count"].fillna(0)
    
    # Define the target variable; for demonstration:
    features_df["performance"] = features_df["completion_ratio"] + features_df["feedback_count"]
    
    print("Engineered Features:")
    print(features_df.head())

    # --- Step 2: Model Training ---
    # Select predictors and target
    X = features_df[["total_assignments", "completed_assignments", "completion_ratio", "feedback_count"]]
    y = features_df["performance"]

    # Split data into training and testing sets (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Create and train a Random Forest regressor
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate the model
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print("Mean Squared Error:", mse)
    print("R² Score:", r2)

    # Save the trained model
    with open("employee_performance_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print("Model saved as employee_performance_model.pkl")

if __name__ == "__main__":
    main()
