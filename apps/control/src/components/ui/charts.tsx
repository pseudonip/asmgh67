import type { Component } from "solid-js"
import {
  createEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount
} from "solid-js"

import { unwrap } from "solid-js/store"

import type { Ref } from "@solid-primitives/refs"
import { mergeRefs } from "@solid-primitives/refs"

import type {
  ChartComponent,
  ChartData,
  ChartItem,
  ChartOptions,
  Plugin as ChartPlugin,
  ChartType,
  ChartTypeRegistry,
  TooltipModel
} from "chart.js"

import {
  ArcElement,
  BarController,
  BarElement,
  BubbleController,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
  PolarAreaController,
  RadarController,
  RadialLinearScale,
  ScatterController,
  Tooltip
} from "chart.js"

type TypedChartProps = {
  data: ChartData
  options?: ChartOptions
  plugins?: ChartPlugin[]
  ref?: Ref<HTMLCanvasElement | null>
  width?: number
  height?: number
}

type ChartProps = TypedChartProps & {
  type: ChartType
}

type ChartContext = {
  chart: Chart
  tooltip: TooltipModel<keyof ChartTypeRegistry>
}

function cssVar(name: string, fallback = "") {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

function alpha(color: string, opacity: number) {
  return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`
}

function getPrimary() {
  return cssVar("--primary")
}

function getBorder() {
  return cssVar("--border")
}

function getMuted() {
  return cssVar("--muted-foreground")
}

function themedData(data: ChartData): ChartData {
  const primary = getPrimary()

  return {
    ...data,
    datasets: data.datasets.map((dataset) => {
      return {
        ...dataset,

        borderColor: primary,
        backgroundColor: alpha(primary, 0.25),

        pointBackgroundColor: primary,
        pointBorderColor: primary,

        hoverBackgroundColor: primary,
        hoverBorderColor: primary,

        borderWidth: 2,
        tension: 0.35,

        pointRadius: 4,
        pointHoverRadius: 6,

        fill: true
      }
    })
  }
}

const BaseChart: Component<ChartProps> = (rawProps) => {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement | null>()
  const [chart, setChart] = createSignal<Chart>()

  const props = mergeProps(
    {
      width: 512,
      height: 512,
      options: { responsive: true } as ChartOptions,
      plugins: [] as ChartPlugin[]
    },
    rawProps
  )

  const init = () => {
    const ctx = canvasRef()?.getContext("2d")
    if (!ctx) return

    const config = unwrap(props)

    const instance = new Chart(ctx as ChartItem, {
      type: config.type,
      data: themedData(config.data),
      options: config.options,
      plugins: config.plugins
    })

    setChart(instance)
  }

  onMount(() => init())

  createEffect(
    on(
      () => props.data,
      () => {
        const instance = chart()
        if (!instance) return
        instance.data = themedData(props.data)
        instance.update()
      }
    )
  )

  createEffect(
    on(
      () => props.options,
      () => {
        const instance = chart()
        if (!instance) return
        instance.options = props.options
        instance.update()
      }
    )
  )

  createEffect(
    on(
      [() => props.width, () => props.height],
      () => {
        const instance = chart()
        if (!instance) return
        instance.resize(props.width, props.height)
      }
    )
  )

  createEffect(
    on(
      () => props.type,
      () => {
        const instance = chart()
        if (!instance) return

        const dims = [instance.width, instance.height]

        instance.destroy()
        init()
        chart()?.resize(...dims)
      }
    )
  )

  onCleanup(() => {
    chart()?.destroy()
    mergeRefs(props.ref, null)
  })

  Chart.register(Filler, Legend, Tooltip)

  return (
    <canvas
      ref={mergeRefs(props.ref, (el) => setCanvasRef(el))}
      width={props.width}
      height={props.height}
    />
  )
}

function showTooltip(context: ChartContext) {
  let el = document.getElementById("chartjs-tooltip")

  if (!el) {
    el = document.createElement("div")
    el.id = "chartjs-tooltip"
    el.className = "chart-tooltip"
    document.body.appendChild(el)
  }

  const model = context.tooltip

  if (model.opacity === 0 || !model.body) {
    el.style.opacity = "0"
    return
  }

  let html = ""

  model.title.forEach((title) => {
    html += `<div style="font-weight:600;margin-bottom:4px;">${title}</div>`
  })

  const body = model.body.flatMap((b) => b.lines)

  body.forEach((line, i) => {
    const colors = model.labelColors[i]

    html += `
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
        <span style="width:8px;height:8px;border-radius:9999px;background:${colors.backgroundColor};border:1px solid ${colors.borderColor};"></span>
        ${line}
      </div>
    `
  })

  el.innerHTML = html

  const pos = context.chart.canvas.getBoundingClientRect()

  el.style.opacity = "1"
  el.style.position = "absolute"
  el.style.left = `${pos.left + window.scrollX + model.caretX}px`
  el.style.top = `${pos.top + window.scrollY + model.caretY}px`
  el.style.pointerEvents = "none"
}

function createTypedChart(
  type: ChartType,
  components: ChartComponent[]
): Component<TypedChartProps> {
  Chart.register(...components)

  return (props) => {
    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,

      scales: ["bar", "line", "scatter"].includes(type)
        ? {
            x: {
              grid: {
                display: false
              },
              border: {
                display: false
              },
              ticks: {
                color: getMuted()
              }
            },

            y: {
              grid: {
                color: alpha(getBorder(), 0.25)
              },

              border: {
                display: false
              },

              ticks: {
                color: getMuted()
              }
            }
          }
        : {},

      plugins: {
        legend: ["bar", "line"].includes(type)
          ? {
              display: true,
              align: "end",
              labels: {
                usePointStyle: true,
                boxWidth: 6,
                boxHeight: 6,
                color: getMuted()
              }
            }
          : { display: false },

        tooltip: {
          enabled: false,
          external: (ctx) => showTooltip(ctx as ChartContext)
        }
      }
    }

    return <BaseChart type={type} options={options} {...props} />
  }
}

const BarChart = createTypedChart("bar", [
  BarController,
  BarElement,
  CategoryScale,
  LinearScale
])

const BubbleChart = createTypedChart("bubble", [
  BubbleController,
  PointElement,
  LinearScale
])

const DonutChart = createTypedChart("doughnut", [
  DoughnutController,
  ArcElement
])

const LineChart = createTypedChart("line", [
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
])

const PieChart = createTypedChart("pie", [
  PieController,
  ArcElement
])

const PolarAreaChart = createTypedChart("polarArea", [
  PolarAreaController,
  ArcElement,
  RadialLinearScale
])

const RadarChart = createTypedChart("radar", [
  RadarController,
  LineElement,
  PointElement,
  RadialLinearScale
])

const ScatterChart = createTypedChart("scatter", [
  ScatterController,
  PointElement,
  LinearScale
])

export {
  BaseChart as Chart,
  BarChart,
  BubbleChart,
  DonutChart,
  LineChart,
  PieChart,
  PolarAreaChart,
  RadarChart,
  ScatterChart
}
