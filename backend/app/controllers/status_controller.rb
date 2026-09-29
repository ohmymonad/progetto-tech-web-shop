class StatusController < ApplicationController
  def show
    render json: {
      app: "shop backend v2",
      status: "heloo file watch",
      environment: Rails.env,
      timestamp: Time.current
    }
  end
end
