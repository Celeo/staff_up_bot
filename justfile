set dotenv-load := false

permissions := "--allow-read=config.json --allow-write=config.json --allow-net=discord.com,gateway.discord.gg,status.vatsim.net,data.vatsim.net,api.vatsim.net"
runfile := "main.ts"
compiled_name := "staff_up_bot"

run:
  @deno run {{permissions}} {{runfile}} -d

run-no-debug:
  @deno run {{permissions}} {{runfile}}

debug:
  @deno run --inspect-brk=0.0.0.0:9229 {{permissions}} {{runfile}}

compile:
  @rm -f {{compiled_name}} {{compiled_name}}.zip {{compiled_name}}.tar.gz
  @deno compile {{permissions}} {{runfile}}
  @zip -r {{compiled_name}}.zip {{compiled_name}}
  @tar -cpzf {{compiled_name}}.tar.gz {{compiled_name}}

clean:
  @rm -f {{compiled_name}} {{compiled_name}}.zip {{compiled_name}}.tar.gz

deploy: clean compile
  rsync -avz --progress {{compiled_name}}.tar.gz $SSH_HOST_NAME:/srv/
