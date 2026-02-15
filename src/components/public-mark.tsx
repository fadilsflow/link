import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Group, GroupSeparator } from '@/components/ui/group'
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'

export default function PublicMark() {
  return (
    <Group aria-label="File actions">
      <Button
        variant={'outline'}
        className="font-sans"
        render={<Link to="/" />}
      >
        🖖 Made with <span className="font-bold">Kreasi.pro</span>
      </Button>
      <GroupSeparator />
      <Menu>
        <MenuTrigger render={<Button variant={'outline'} />}>Ξ</MenuTrigger>
        <MenuPopup>
          <MenuItem>Kreasi.pro Profile</MenuItem>
          <MenuSeparator />
          <MenuItem>Terms of Use</MenuItem>
          <MenuItem>Privacy Policy</MenuItem>
        </MenuPopup>
      </Menu>
    </Group>
  )
}
