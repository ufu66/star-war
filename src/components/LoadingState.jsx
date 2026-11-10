const LOADING_GIF_URL =
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWo1YWQ0b3d0NG05dHEzY3EzeDYwdWN5MjRqdGsxdm5yMzdiN2M5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XgGU3zLhTFUQ4wCBKq/giphy.gif";

export default function LoadingState({ message, compact = false }) {
  return (
    <div className={`loading-state${compact ? " loading-state-compact" : ""}`}>
      <img src={LOADING_GIF_URL} alt="" aria-hidden="true" />
      <p>{message}</p>
      <span>Star Wars Rebellion GIF by Blibli.com</span>
    </div>
  );
}
